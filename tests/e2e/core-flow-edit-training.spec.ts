import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { test, expect } from '@playwright/test'
import { getLoopbackSupabaseEnv } from './helpers/supabaseTestGuard'
import { viennaLocalToUTC } from '../../src/lib/datetime'

// FC-TRAINING-003 „Training bearbeiten" — Kernflow-Regressionstest.
//
// Deckt ab: autorisierte Bearbeitung (team_owner-only) über die echte
// Edit-UI inkl. RSVP-Warnung/Bestätigung bei Zeitänderung, Sichtbarkeit der
// Änderung auf Detailseite, Trainingsliste, Teamdetailseite und Dashboard,
// Erhalt von RSVP/Attendance und der unveränderlichen Felder (ends_at,
// team_id, club_id, season_id, created_by, event_type, is_cancelled), echte
// serverseitige Negativtests per direktem RPC-Aufruf (fremde Rolle, fremdes
// Team, bereits begonnenes Training, Verschieben in die Vergangenheit,
// abgesagtes Training, Nicht-Training-Event, leerer Titel, ungültige/nicht
// existente Event-ID) sowie UI-seitiges Gating auf der Edit-Route.
//
// Bewusst NICHT abgedeckt (analog FC-TRAINING-005): ein head_coach-only-
// oder assistant_coach-only-Testfall. Es existiert kein legitimer App-/
// RPC-Weg, ein solches Konto ohne Service-Role/direkte
// team_member_roles-Manipulation zu erzeugen. Diese beiden Rollen sind
// stattdessen durch Code-Review der RPC (update_training() prüft
// has_team_role(..., 'team_owner', 'head_coach', 'assistant_coach')
// symmetrisch für alle drei Rollen, KEIN team_manager) sowie den statischen
// Rollenvertrags-Test in tests/e2e/trainingEditRoleContract.spec.ts
// abgedeckt — das ersetzt NICHT diese offene Integrationsverifikation.

/**
 * Siehe core-flow-cancel-training.spec.ts für die vollständige Begründung
 * dieses Musters: eigenständiger @supabase/supabase-js-Client, angemeldet
 * per regulärem E-Mail/Passwort-Login (dieselben Zugangsdaten wie im
 * vorherigen /register-Formular), ausschließlich für direkte RPC-Aufrufe
 * unabhängig von der Browser-Cookie-Session. Keine Service-Role.
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

test('Kernflow: Training bearbeiten (team_owner-only)', async ({ browser }) => {
  test.setTimeout(240_000)

  // Sicherheitsgrenze: muss als allererste Anweisung im Testkörper laufen,
  // bevor irgendeine Browser-Aktion oder ein RPC-Aufruf stattfindet.
  const supabaseEnv = getLoopbackSupabaseEnv()

  const ts             = Date.now()
  const trainerEmail   = `trainer+edit${ts}@vereon.test`
  const playerEmail    = `player+edit${ts}@vereon.test`
  const otherEmail     = `other+edit${ts}@vereon.test`
  const password       = 'Test1234!'
  const teamName       = `E2E Edit Team ${ts}`
  const otherTeamName  = `E2E Edit OtherTeam ${ts}`
  const eventTitle     = `E2E Edit Training ${ts}`
  const updatedTitle   = `E2E Edit Training ${ts} (geändert)`
  const playerFirst    = 'Petra'
  const playerLast     = 'Bearbeitungsspielerin'
  const playerName     = `${playerFirst} ${playerLast}`

  const trainerCtx = await browser.newContext()
  const playerCtx  = await browser.newContext()
  const otherCtx   = await browser.newContext()
  const tPage      = await trainerCtx.newPage()
  const pPage      = await playerCtx.newPage()
  const oPage      = await otherCtx.newPage()

  try {
    // ── 1a. Trainer registrieren, Team OHNE head_coach-Zusatzrolle anlegen ──
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

    const trainerApi = await signInSupabaseClient(supabaseEnv, trainerEmail, password)
    const { data: teamId, error: createTeamError } = await trainerApi.rpc(
      'create_independent_team',
      { p_team_name: teamName, p_also_head_coach: false },
    )
    expect(createTeamError, createTeamError?.message).toBeNull()
    expect(teamId).toBeTruthy()

    // ── 1b. Zweites Team + Trainer für den "fremdes Team"-Negativtest ───────
    await oPage.goto('/register')
    await oPage.fill('#first_name', 'Otto')
    await oPage.fill('#last_name', 'Anderertrainer')
    await oPage.fill('#email', otherEmail)
    await oPage.fill('#date_of_birth', '1980-01-01')
    await oPage.selectOption('select#onboarding_role', 'coach')
    await oPage.fill('#password', password)
    await oPage.check('input[name="terms_accepted"]')
    await oPage.check('input[name="privacy_accepted"]')
    await oPage.getByRole('button', { name: 'Konto erstellen' }).click()
    await oPage.waitForURL('/dashboard')

    const otherApi = await signInSupabaseClient(supabaseEnv, otherEmail, password)
    const { data: otherTeamId, error: createOtherTeamError } = await otherApi.rpc(
      'create_independent_team',
      { p_team_name: otherTeamName, p_also_head_coach: false },
    )
    expect(createOtherTeamError, createOtherTeamError?.message).toBeNull()
    expect(otherTeamId).toBeTruthy()

    // ── 2. Join-Link lesen, Player tritt bei, Trainer nimmt an ──────────────
    await tPage.goto(`/teams/${teamId}/invite`)
    const joinUrl  = await tPage.inputValue('input[aria-label="Einladungslink"]')
    const joinCode = joinUrl.split('/join/')[1]
    const joinPath = `/join/${joinCode}`

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
    await pPage.getByRole('button', { name: 'Ich trete selbst bei' }).click()
    await expect(pPage.getByText(playerFirst)).toBeVisible()
    await pPage.getByRole('button', { name: 'Beitrittsanfrage senden' }).click()
    await expect(pPage.getByText('Anfrage gesendet')).toBeVisible()

    await tPage.goto(`/teams/${teamId}/requests`)
    await expect(tPage.getByText(playerName)).toBeVisible()
    await tPage.getByRole('button', { name: 'Annehmen' }).click()
    await expect(tPage.getByText('Keine offenen Anfragen')).toBeVisible({ timeout: 10_000 })

    const playerApi = await signInSupabaseClient(supabaseEnv, playerEmail, password)

    // ── 3. Trainer legt das Haupt-Training per direktem RPC an ──────────────
    // (statt über /events/new — die bestehende Create-UI bietet dafür kein
    // Feld; die Edit-UI selbst wird unten über den echten Browser-Flow
    // getestet.) ends_at bleibt bewusst null: die spätere UI-Bearbeitung
    // verschiebt starts_at auf einen anderen Tag (Schritt 9) — mit einem
    // gesetzten ends_at würde das den ends_at > starts_at-Constraint
    // verletzen. Der Erhalt eines tatsächlich gesetzten ends_at wird separat
    // in Schritt 8b per eigenständigem Training geprüft.
    const initialStartsAt = new Date(Date.now() + 2 * 86_400_000).toISOString()
    const { data: eventId, error: createEventError } = await trainerApi.rpc('create_event', {
      p_team_id:     teamId,
      p_title:       eventTitle,
      p_starts_at:   initialStartsAt,
      p_event_type:  'training',
      p_ends_at:     null,
      p_location:    'Ursprünglicher Ort',
      p_description: 'Ursprüngliche Beschreibung',
    })
    expect(createEventError, createEventError?.message).toBeNull()
    expect(eventId).toBeTruthy()

    // Ausgangswerte der unveränderlichen Felder festhalten, um sie nach der
    // Bearbeitung gegen die tatsächlich gespeicherten Werte zu prüfen (statt
    // gegen hart codierte Annahmen wie „ist bei einem eigenständigen Team
    // immer null").
    const { data: originalEvent } = await trainerApi
      .from('events')
      .select('team_id, club_id, season_id, created_by, event_type, is_cancelled')
      .eq('id', eventId)
      .single()

    // ── 4. Player sagt zu -> RSVP existiert vor der Bearbeitung ─────────────
    await pPage.goto(`/teams/${teamId}/events/${eventId}`)
    const playerId = await pPage.locator('input[name="player_id"]').inputValue()
    expect(playerId).toBeTruthy()
    await Promise.all([
      pPage.waitForURL(/\/teams\/[^/]+\/events\/[^/]+$/),
      pPage.getByRole('button', { name: 'Zusagen' }).click(),
    ])

    // ── 5. Echte Negativtests VOR jeder Bearbeitung ──────────────────────────
    // 5a. Player (keine Trainerrolle) versucht per direktem RPC zu bearbeiten.
    const { error: playerEditError } = await playerApi.rpc('update_training', {
      p_event_id:  eventId,
      p_title:     'Manipulierter Titel',
      p_starts_at: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    })
    expect(playerEditError).not.toBeNull()
    expect(playerEditError!.message.toLowerCase()).toContain('termin nicht gefunden')

    // 5b. Trainer eines fremden Teams versucht per direktem RPC zu bearbeiten.
    const { error: otherTeamEditError } = await otherApi.rpc('update_training', {
      p_event_id:  eventId,
      p_title:     'Manipulierter Titel',
      p_starts_at: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    })
    expect(otherTeamEditError).not.toBeNull()
    expect(otherTeamEditError!.message.toLowerCase()).toContain('termin nicht gefunden')

    // 5c. Leerer Titel wird serverseitig abgelehnt.
    const { error: emptyTitleError } = await trainerApi.rpc('update_training', {
      p_event_id:  eventId,
      p_title:     '   ',
      p_starts_at: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    })
    expect(emptyTitleError).not.toBeNull()
    expect(emptyTitleError!.message.toLowerCase()).toContain('titel darf nicht leer')

    // 5d. Verschieben auf eine vergangene Startzeit wird serverseitig abgelehnt.
    const { error: pastStartError } = await trainerApi.rpc('update_training', {
      p_event_id:  eventId,
      p_title:     eventTitle,
      p_starts_at: new Date(Date.now() - 3_600_000).toISOString(),
    })
    expect(pastStartError).not.toBeNull()
    expect(pastStartError!.message.toLowerCase()).toContain('zukunft')

    // 5e. Ungültige (falsch formatierte) Event-ID.
    const { error: invalidUuidError } = await trainerApi.rpc('update_training', {
      p_event_id:  'not-a-uuid',
      p_title:     eventTitle,
      p_starts_at: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    })
    expect(invalidUuidError).not.toBeNull()

    // 5f. Nicht existente (aber gültig formatierte) Event-ID.
    const { error: notFoundUuidError } = await trainerApi.rpc('update_training', {
      p_event_id:  '00000000-0000-0000-0000-000000000000',
      p_title:     eventTitle,
      p_starts_at: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    })
    expect(notFoundUuidError).not.toBeNull()
    expect(notFoundUuidError!.message.toLowerCase()).toContain('termin nicht gefunden')

    // 5g. Anonymer (nicht eingeloggter) Client kann update_training gar nicht
    // erst aufrufen — REVOKE EXECUTE ... FROM PUBLIC/anon greift bereits auf
    // Datenbank-/PostgREST-Ebene, vor jeder internen Business-Logik. Eigenes,
    // dediziertes Training, um Seiteneffekte auf andere Schritte zu vermeiden.
    const { data: anonCheckEventId, error: createAnonCheckError } = await trainerApi.rpc(
      'create_event',
      {
        p_team_id:    teamId,
        p_title:      `E2E Anon ${ts}`,
        p_starts_at:  new Date(Date.now() + 9 * 86_400_000).toISOString(),
        p_event_type: 'training',
      },
    )
    expect(createAnonCheckError, createAnonCheckError?.message).toBeNull()
    const { data: anonCheckOriginal } = await trainerApi
      .from('events')
      .select('title, starts_at')
      .eq('id', anonCheckEventId)
      .single()

    // Echter anonymer Client ohne Login — bewusst KEIN signInWithPassword().
    const anonClient = createSupabaseClient(supabaseEnv.url, supabaseEnv.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error: anonEditError } = await anonClient.rpc('update_training', {
      p_event_id:  anonCheckEventId,
      p_title:     'Anonym manipuliert',
      p_starts_at: new Date(Date.now() + 10 * 86_400_000).toISOString(),
    })
    expect(anonEditError).not.toBeNull()
    // Würde die Meldung „Nicht eingeloggt" lauten, hätte das bedeutet, dass
    // die Funktion trotz REVOKE EXECUTE FROM anon tatsächlich ausgeführt
    // wurde und nur die interne auth.uid()-Prüfung gegriffen hat — das wäre
    // KEIN Nachweis für das REVOKE, sondern im Gegenteil ein Hinweis auf
    // einen fehlgeschlagenen REVOKE. Der erwartete Fehler ist ein
    // datenbankseitiger Berechtigungsfehler (z. B. „permission denied for
    // function..."), der VOR Ausführung des Funktionskörpers auftritt.
    expect(anonEditError!.message.toLowerCase()).not.toContain('nicht eingeloggt')

    const { data: anonCheckAfter } = await trainerApi
      .from('events')
      .select('title, starts_at')
      .eq('id', anonCheckEventId)
      .single()
    expect(anonCheckAfter?.title).toBe(anonCheckOriginal?.title)
    expect(anonCheckAfter?.starts_at).toBe(anonCheckOriginal?.starts_at)

    // Nach allen Negativtests bleibt das Training vollständig unverändert.
    const { data: unchangedEvent } = await trainerApi
      .from('events')
      .select('title, starts_at, ends_at, location, description')
      .eq('id', eventId)
      .single()
    expect(unchangedEvent?.title).toBe(eventTitle)
    expect(unchangedEvent?.ends_at).toBeNull()

    // ── 6. Bereits begonnenes Training wird direkt durch die RPC abgewiesen ─
    const { data: startedEventId, error: createStartedError } = await trainerApi.rpc(
      'create_event',
      {
        p_team_id:    teamId,
        p_title:      `E2E Started ${ts}`,
        p_starts_at:  new Date(Date.now() - 3_600_000).toISOString(),
        p_event_type: 'training',
      },
    )
    expect(createStartedError, createStartedError?.message).toBeNull()
    const { error: startedEditError } = await trainerApi.rpc('update_training', {
      p_event_id:  startedEventId,
      p_title:     'Zu spät geändert',
      p_starts_at: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    })
    expect(startedEditError).not.toBeNull()
    expect(startedEditError!.message.toLowerCase()).toContain('bereits begonnen')

    // UI-seitiges Gating: eigenes, aber bereits begonnenes Training -> Redirect
    // zur Detailseite statt eines funktionslosen Edit-Formulars.
    await tPage.goto(`/teams/${teamId}/events/${startedEventId}/edit`)
    await tPage.waitForURL(`**/teams/${teamId}/events/${startedEventId}`)

    // ── 7. Abgesagtes Training wird direkt durch die RPC abgewiesen ─────────
    const { data: cancelledEventId, error: createCancelledError } = await trainerApi.rpc(
      'create_event',
      {
        p_team_id:    teamId,
        p_title:      `E2E Cancelled ${ts}`,
        p_starts_at:  new Date(Date.now() + 4 * 86_400_000).toISOString(),
        p_event_type: 'training',
      },
    )
    expect(createCancelledError, createCancelledError?.message).toBeNull()
    const { error: cancelForEditTestError } = await trainerApi.rpc('cancel_event', {
      p_event_id: cancelledEventId,
    })
    expect(cancelForEditTestError).toBeNull()
    const { error: cancelledEditError } = await trainerApi.rpc('update_training', {
      p_event_id:  cancelledEventId,
      p_title:     'Nach Absage geändert',
      p_starts_at: new Date(Date.now() + 5 * 86_400_000).toISOString(),
    })
    expect(cancelledEditError).not.toBeNull()
    expect(cancelledEditError!.message.toLowerCase()).toContain('abgesagt')

    await tPage.goto(`/teams/${teamId}/events/${cancelledEventId}/edit`)
    await tPage.waitForURL(`**/teams/${teamId}/events/${cancelledEventId}`)

    // ── 8. match-/Nicht-Training-Event wird direkt durch die RPC abgewiesen ─
    const { data: matchEventId, error: createMatchError } = await trainerApi.rpc('create_event', {
      p_team_id:    teamId,
      p_title:      `E2E Match ${ts}`,
      p_starts_at:  new Date(Date.now() + 6 * 86_400_000).toISOString(),
      p_event_type: 'match',
    })
    expect(createMatchError, createMatchError?.message).toBeNull()
    const { error: matchEditError } = await trainerApi.rpc('update_training', {
      p_event_id:  matchEventId,
      p_title:     'Match umbenannt',
      p_starts_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    })
    expect(matchEditError).not.toBeNull()
    expect(matchEditError!.message.toLowerCase()).toContain('termin nicht gefunden')

    // UI-seitiges Gating: Nicht-Training-Event -> notFound() (kein Rückschluss
    // auf Existenz), konsistent mit der bestehenden Detailseite.
    await tPage.goto(`/teams/${teamId}/events/${matchEventId}/edit`)
    await expect(tPage.getByText('This page could not be found.')).toBeVisible()

    // ── 8b. ends_at bleibt bei Bearbeitung unverändert (eigenes Training) ───
    // Eigenständiges Training mit gesetztem ends_at (18:00–20:00 Uhr Wiener
    // Lokalzeit desselben Tages), um den ends_at > starts_at-Constraint nicht
    // zu verletzen. update_training() kennt kein p_ends_at-Argument und darf
    // den Wert daher unter keinen Umständen verändern.
    const endsAtCheckDate     = new Date(Date.now() + 8 * 86_400_000).toISOString().slice(0, 10)
    const endsAtCheckStartsAt = viennaLocalToUTC(endsAtCheckDate, '18:00')
    const endsAtCheckEndsAt   = viennaLocalToUTC(endsAtCheckDate, '20:00')
    const { data: endsAtCheckEventId, error: createEndsAtCheckError } = await trainerApi.rpc(
      'create_event',
      {
        p_team_id:    teamId,
        p_title:      `E2E EndsAt ${ts}`,
        p_starts_at:  endsAtCheckStartsAt,
        p_event_type: 'training',
        p_ends_at:    endsAtCheckEndsAt,
      },
    )
    expect(createEndsAtCheckError, createEndsAtCheckError?.message).toBeNull()

    const { error: endsAtCheckEditError } = await trainerApi.rpc('update_training', {
      p_event_id:  endsAtCheckEventId,
      p_title:     `E2E EndsAt ${ts} (geändert)`,
      p_starts_at: viennaLocalToUTC(endsAtCheckDate, '19:00'),
    })
    expect(endsAtCheckEditError, endsAtCheckEditError?.message).toBeNull()

    const { data: endsAtCheckEvent } = await trainerApi
      .from('events')
      .select('starts_at, ends_at')
      .eq('id', endsAtCheckEventId)
      .single()
    expect(endsAtCheckEvent?.starts_at).toBeTruthy()
    expect(endsAtCheckEvent?.ends_at).toBeTruthy()
    expect(new Date(endsAtCheckEvent!.starts_at).getTime()).toBe(
      new Date(viennaLocalToUTC(endsAtCheckDate, '19:00')).getTime(),
    )
    expect(new Date(endsAtCheckEvent!.ends_at!).getTime()).toBe(
      new Date(endsAtCheckEndsAt).getTime(),
    )

    // ── 9. Positivtest: Trainer (team_owner-only) bearbeitet über die echte UI ─
    await tPage.goto(`/teams/${teamId}/events/${eventId}`)
    await expect(tPage.getByRole('link', { name: 'Bearbeiten' })).toBeVisible()
    await tPage.getByRole('link', { name: 'Bearbeiten' }).click()
    await tPage.waitForURL(`**/teams/${teamId}/events/${eventId}/edit`)

    // Formular ist mit den bestehenden Werten vorbefüllt.
    await expect(tPage.locator('#title')).toHaveValue(eventTitle)
    await expect(tPage.locator('#location')).toHaveValue('Ursprünglicher Ort')
    await expect(tPage.locator('#description')).toHaveValue('Ursprüngliche Beschreibung')

    // RSVP-Warnung: dauerhafter Hinweis, da bereits eine Rückmeldung existiert.
    await expect(tPage.getByText(/Rückmeldung.*(liegt|liegen) bereits vor/)).toBeVisible()

    const newDate = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10)
    await tPage.fill('#title', updatedTitle)
    await tPage.fill('#starts_at_date', newDate)
    await tPage.fill('#starts_at_time', '19:30')
    await tPage.fill('#location', 'Neuer Ort')
    await tPage.fill('#description', 'Neue Beschreibung')

    // Zeitänderung + vorhandene RSVP -> zusätzliche bewusste Bestätigung.
    await tPage.getByRole('button', { name: 'Änderungen speichern' }).click()
    await expect(tPage.getByText(/bestehende Rückmeldung.*(bleibt|bleiben) erhalten/)).toBeVisible()
    await Promise.all([
      tPage.waitForURL(`**/teams/${teamId}/events/${eventId}`),
      tPage.getByRole('button', { name: 'Bestätigen' }).click(),
    ])

    await expect(tPage.getByText(updatedTitle)).toBeVisible()
    await expect(tPage.getByText('Neuer Ort')).toBeVisible()
    await expect(tPage.getByText('Neue Beschreibung')).toBeVisible()

    // ── 10. Unveränderliche Felder und RSVP/Attendance bleiben erhalten ─────
    const { data: editedEvent } = await trainerApi
      .from('events')
      .select('team_id, club_id, season_id, created_by, event_type, is_cancelled, ends_at, starts_at')
      .eq('id', eventId)
      .single()
    expect(editedEvent?.team_id).toBe(originalEvent?.team_id)
    expect(editedEvent?.club_id).toBe(originalEvent?.club_id)
    expect(editedEvent?.season_id).toBe(originalEvent?.season_id)
    expect(editedEvent?.created_by).toBe(originalEvent?.created_by)
    expect(editedEvent?.event_type).toBe(originalEvent?.event_type)
    expect(editedEvent?.is_cancelled).toBe(originalEvent?.is_cancelled)
    expect(editedEvent?.ends_at).toBeNull()
    expect(editedEvent?.starts_at).not.toBe(initialStartsAt)

    const { data: attendanceRow } = await trainerApi
      .from('event_attendance')
      .select('rsvp_status')
      .eq('event_id', eventId)
      .eq('player_id', playerId)
      .single()
    expect(attendanceRow?.rsvp_status).toBe('attending')

    // ── 11. Sichtbarkeit der Änderung auf allen relevanten Seiten ───────────
    await tPage.goto(`/teams/${teamId}/events`)
    await expect(tPage.getByText(updatedTitle)).toBeVisible()

    await tPage.goto(`/teams/${teamId}`)
    await expect(tPage.getByText(updatedTitle)).toBeVisible()

    await tPage.goto('/dashboard')
    await expect(tPage.getByText(updatedTitle)).toBeVisible()

  } finally {
    await trainerCtx.close()
    await playerCtx.close()
    await otherCtx.close()
  }
})
