import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { test, expect } from '@playwright/test'
import { getLoopbackSupabaseEnv } from './helpers/supabaseTestGuard'

// FC-TRAINING-005 „Training absagen" — Kernflow-Regressionstest.
//
// Deckt ab: autorisierte Absage (team_owner-only), Sichtbarkeit des
// abgesagten Trainings (nicht mehr herausgefiltert) auf Detailseite,
// Trainingsliste, Teamdetailseite und Dashboard, Erhalt der RSVP-Historie,
// serverseitige Blockade neuer/geänderter RSVPs nach Absage, ein echter
// serverseitiger Negativtest (unberechtigte Rolle versucht abzusagen) sowie
// Idempotenz eines wiederholten cancel_event()-Aufrufs.
//
// Bewusst NICHT abgedeckt (siehe Auftragsbeschreibung): ein
// head_coach-only- oder assistant_coach-only-Testfall. Es existiert kein
// legitimer App-/RPC-Weg, ein solches Konto ohne Service-Role/direkte
// team_member_roles-Manipulation zu erzeugen. Diese beiden Rollen sind
// stattdessen durch Code-Review der RPC (cancel_event() prüft
// has_team_role(..., 'team_owner', 'head_coach', 'assistant_coach')
// symmetrisch für alle drei Rollen) sowie den statischen Rollenvertrags-Test
// in tests/e2e/trainingCancelRoleContract.spec.ts abgedeckt.

/**
 * Erzeugt einen eigenständigen @supabase/supabase-js-Client und meldet ihn
 * per regulärem E-Mail/Passwort-Login an — dieselben Zugangsdaten, mit denen
 * sich der Nutzer zuvor über das reguläre /register-Formular im Browser
 * registriert hat. Dient ausschließlich dazu, RPCs (create_independent_team,
 * cancel_event, respond_to_event) mit einer echten authentifizierten Session
 * direkt aufzurufen, unabhängig von der Browser-Cookie-Session der jeweiligen
 * Playwright-Page. Keine Service-Role, keine privilegierte Datenmanipulation.
 *
 * Nimmt die öffentlichen Supabase-Zugangsdaten als Parameter entgegen, statt
 * sie selbst zu laden — der Aufrufer lädt/validiert sie einmalig zentral
 * über getLoopbackSupabaseEnv() vor der ersten Browser-Aktion.
 */
async function signInSupabaseClient(
  env: { url: string; anonKey: string },
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

test('Kernflow: Training absagen (team_owner-only)', async ({ browser }) => {
  test.setTimeout(180_000)

  // Sicherheitsgrenze: registriert echte Nutzer und legt echte Daten über
  // den Browser sowie per direktem RPC an — muss als allererste Anweisung
  // im Testkörper laufen, bevor irgendeine Browser-Aktion stattfindet, und
  // bricht sofort ab, falls die konfigurierte Supabase-URL nicht auf eine
  // lokale Loopback-Adresse zeigt.
  const supabaseEnv = getLoopbackSupabaseEnv()

  const ts           = Date.now()
  const trainerEmail = `trainer+cancel${ts}@vereon.test`
  const playerEmail  = `player+cancel${ts}@vereon.test`
  const password     = 'Test1234!'
  const teamName     = `E2E Cancel Team ${ts}`
  const eventTitle   = `E2E Cancel Training ${ts}`
  const playerFirst  = 'Petra'
  const playerLast   = 'Absagespielerin'
  const playerName   = `${playerFirst} ${playerLast}`

  const trainerCtx = await browser.newContext()
  const playerCtx  = await browser.newContext()
  const tPage      = await trainerCtx.newPage()
  const pPage      = await playerCtx.newPage()

  try {
    // ── 1a. Trainer registrieren (regulärer UI-Flow, legt Browser-Session an) ──
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

    // ── 1b. Team OHNE head_coach-Zusatzrolle anlegen ─────────────────────────
    // Das bestehende "Team erstellen"-Formular (CreateTeamForm.tsx →
    // createTeamAction) ruft create_independent_team() immer mit
    // p_also_head_coach: true auf und bietet keine UI-Option für ein
    // team_owner-only-Konto. Für einen belastbaren Autorisierungstest
    // (nur team_owner, NICHT zusätzlich head_coach) rufen wir die RPC
    // direkt mit einer echten, per Login authentifizierten Session auf.
    const trainerApi = await signInSupabaseClient(supabaseEnv, trainerEmail, password)
    const { data: teamId, error: createTeamError } = await trainerApi.rpc(
      'create_independent_team',
      {
        p_team_name: teamName,
        p_also_head_coach: false,
      },
    )
    expect(createTeamError, createTeamError?.message).toBeNull()
    expect(teamId).toBeTruthy()

    await tPage.goto(`/teams/${teamId}`)
    await expect(tPage.getByText(teamName)).toBeVisible()

    // ── 2. Join-Link lesen ───────────────────────────────────────────────────
    await tPage.goto(`/teams/${teamId}/invite`)
    const joinUrl  = await tPage.inputValue('input[aria-label="Einladungslink"]')
    const joinCode = joinUrl.split('/join/')[1]
    expect(joinCode).toBeTruthy()
    const joinPath = `/join/${joinCode}`

    // ── 3. Player registriert sich und tritt per Einladungscode bei ─────────
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

    await pPage.getByRole('button', { name: 'Ich trete selbst bei' }).click()
    await expect(pPage.getByText(playerFirst)).toBeVisible()
    await pPage.getByRole('button', { name: 'Beitrittsanfrage senden' }).click()
    await expect(pPage.getByText('Anfrage gesendet')).toBeVisible()

    // ── 4. Trainer (team_owner-only) nimmt Beitrittsanfrage an ───────────────
    // approve_join_request() prüft has_team_role(..., 'team_owner', 'head_coach')
    // — team_owner allein reicht aus.
    await tPage.goto(`/teams/${teamId}/requests`)
    await expect(tPage.getByText(playerName)).toBeVisible()
    await tPage.getByRole('button', { name: 'Annehmen' }).click()
    await expect(tPage.getByText('Keine offenen Anfragen')).toBeVisible({ timeout: 10_000 })

    // ── 5. Trainer erstellt Training ─────────────────────────────────────────
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

    // ── 6. Player sagt zu (attending) ────────────────────────────────────────
    await pPage.goto(`/teams/${teamId}/events/${eventId}`)
    const playerId = await pPage.locator('input[name="player_id"]').inputValue()
    expect(playerId).toBeTruthy()
    await Promise.all([
      pPage.waitForURL(/\/teams\/[^/]+\/events\/[^/]+$/),
      pPage.getByRole('button', { name: 'Zusagen' }).click(),
    ])

    await tPage.goto(`/teams/${teamId}/events/${eventId}`)
    await expect(tPage.locator('h3').filter({ hasText: 'Kommt' })).toBeVisible()
    await expect(tPage.getByText(playerName)).toBeVisible()

    // ── 7. Echter Negativtest VOR der Absage ─────────────────────────────────
    // Player (nicht Trainer) versucht, dasselbe — noch aktive — Training per
    // direktem RPC-Aufruf abzusagen. cancel_event() prüft has_team_role(...,
    // 'team_owner', 'head_coach', 'assistant_coach') für v_team_id; der
    // Player hat keine dieser Rollen → serverseitige Ablehnung.
    const playerApi = await signInSupabaseClient(supabaseEnv, playerEmail, password)
    const { error: playerCancelError } = await playerApi.rpc('cancel_event', {
      p_event_id: eventId,
    })
    expect(playerCancelError).not.toBeNull()
    expect(playerCancelError!.message.toLowerCase()).toContain('keine berechtigung')

    // Training bleibt aktiv: kein "Abgesagt"-Badge, Absage-Button weiterhin da.
    await tPage.reload()
    await expect(tPage.getByRole('button', { name: 'Training absagen' })).toBeVisible()
    await expect(tPage.getByText('Abgesagt')).not.toBeVisible()

    // ── 8. Positivtest: Trainer (team_owner-only) sagt Training ab ──────────
    await tPage.getByRole('button', { name: 'Training absagen' }).click()
    await tPage.getByRole('button', { name: 'Bestätigen' }).click()
    // getByText('Abgesagt') matcht standardmäßig case-insensitive als Teilstring
    // und würde sonst zusätzlich den Fließtext "...wurde abgesagt." treffen
    // (Strict-Mode-Konflikt) → .first() grenzt gezielt auf das Badge ein.
    await expect(tPage.getByText('Abgesagt').first()).toBeVisible()
    await expect(
      tPage.getByText('Dieses Training wurde abgesagt.'),
    ).toBeVisible()
    // Absage-Button verschwindet nach erfolgreicher Absage.
    await expect(tPage.getByRole('button', { name: 'Training absagen' })).toHaveCount(0)

    // ── 9. Sichtbarkeit: abgesagtes Training bleibt sichtbar (nicht gefiltert) ─
    await tPage.goto(`/teams/${teamId}/events`)
    await expect(tPage.getByText(eventTitle)).toBeVisible()
    await expect(tPage.getByText('Abgesagt').first()).toBeVisible()

    await tPage.goto(`/teams/${teamId}`)
    await expect(tPage.getByText(eventTitle)).toBeVisible()
    await expect(tPage.getByText('Abgesagt').first()).toBeVisible()

    await tPage.goto('/dashboard')
    await expect(tPage.getByText(eventTitle)).toBeVisible()
    await expect(tPage.getByText('Abgesagt').first()).toBeVisible()

    // ── 10. RSVP-Historie bleibt erhalten ────────────────────────────────────
    await tPage.goto(`/teams/${teamId}/events/${eventId}`)
    await expect(tPage.locator('h3').filter({ hasText: 'Kommt' })).toBeVisible()
    await expect(tPage.getByText(playerName)).toBeVisible()

    // ── 11. Neue/geänderte RSVP wird nach Absage blockiert ───────────────────
    // UI-Ebene: RsvpForm blendet die Antwort-Buttons bei isCancelled aus.
    await pPage.goto(`/teams/${teamId}/events/${eventId}`)
    // Für Nicht-Trainer erscheint der Absage-Hinweis zweimal (Event-Card +
    // RsvpForm-eigener isCancelled-Zweig, identischer Text) → .first().
    await expect(pPage.getByText('Dieses Training wurde abgesagt.').first()).toBeVisible()
    await expect(pPage.getByRole('button', { name: 'Zusagen' })).toHaveCount(0)
    await expect(pPage.getByRole('button', { name: 'Vielleicht' })).toHaveCount(0)
    await expect(pPage.getByRole('button', { name: 'Absagen' })).toHaveCount(0)

    // Serverseitige Ebene: respond_to_event() lehnt Änderungen auf abgesagte
    // Termine explizit ab (Regression für den neuen Cancel-Flow).
    const { error: rsvpAfterCancelError } = await playerApi.rpc('respond_to_event', {
      p_event_id: eventId,
      p_player_id: playerId,
      p_rsvp_status: 'declined',
    })
    expect(rsvpAfterCancelError).not.toBeNull()
    expect(rsvpAfterCancelError!.message.toLowerCase()).toContain('abgesagt')

    // ── 12. Idempotenz: wiederholter cancel_event()-Aufruf auf denselben Termin ─
    const { error: secondCancelError } = await trainerApi.rpc('cancel_event', {
      p_event_id: eventId,
    })
    expect(secondCancelError).toBeNull()

    await tPage.reload()
    await expect(tPage.getByText('Abgesagt').first()).toBeVisible()
    await expect(
      tPage.getByText('Dieses Training wurde abgesagt.'),
    ).toBeVisible()
    await expect(tPage.getByRole('button', { name: 'Training absagen' })).toHaveCount(0)

    // ── 13. Seiten-Gating für Nicht-Trainings-Events (z. B. Spiele) ─────────
    // Legt per direktem RPC ein zweites Event mit p_event_type: 'match' an
    // (analog zum create_independent_team-RPC-Muster oben; Parameter gemäß
    // createEventAction() in src/actions/events.ts) und ruft dessen
    // Detailseite auf.
    //
    // WICHTIG: Dieser Schritt bestätigt AUSSCHLIESSLICH das bestehende
    // Seiten-Gating in src/app/(app)/teams/[teamId]/events/[eventId]/page.tsx
    // (`if (event.event_type !== 'training') notFound()`). Er ist KEIN
    // Nachweis dafür, dass cancelEventAction() bzw. die cancel_event()-RPC
    // selbst einen Match-Event ablehnen würde — das ist eine andere, hier
    // nicht automatisiert getestete Ebene (siehe Kommentarblock am
    // Dateianfang zu bewusst nicht abgedeckten Fällen).
    const matchStartsAt = new Date(Date.now() + 172_800_000).toISOString()
    const { data: matchEventId, error: createMatchEventError } = await trainerApi.rpc(
      'create_event',
      {
        p_team_id:     teamId,
        p_title:       `E2E Match ${ts}`,
        p_starts_at:   matchStartsAt,
        p_event_type:  'match',
        p_location:    null,
        p_description: null,
      },
    )
    expect(createMatchEventError, createMatchEventError?.message).toBeNull()
    expect(matchEventId).toBeTruthy()

    await tPage.goto(`/teams/${teamId}/events/${matchEventId}`)
    await expect(tPage.getByText('This page could not be found.')).toBeVisible()

  } finally {
    await trainerCtx.close()
    await playerCtx.close()
  }
})
