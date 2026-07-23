'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { viennaLocalToUTC } from '@/lib/datetime'

export type CreateEventState = { error: string } | null

export async function createEventAction(
  _prevState: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const teamId       = (formData.get('team_id')        as string | null)?.trim()
  const title        = (formData.get('title')           as string | null)?.trim()
  const startsAtDate = (formData.get('starts_at_date')  as string | null)?.trim()
  const startsAtTime = (formData.get('starts_at_time')  as string | null)?.trim()
  const location     = (formData.get('location')        as string | null)?.trim() || undefined
  const description  = (formData.get('description')     as string | null)?.trim() || undefined

  if (!teamId)       return { error: 'Team-ID fehlt.' }
  if (!title)        return { error: 'Titel ist erforderlich.' }
  if (!startsAtDate) return { error: 'Datum ist erforderlich.' }
  if (!startsAtTime) return { error: 'Uhrzeit ist erforderlich.' }

  let startsAt: string
  try {
    startsAt = viennaLocalToUTC(startsAtDate, startsAtTime)
  } catch {
    return { error: 'Ungültiges Datum oder Uhrzeit.' }
  }

  const supabase = await createClient()
  const { data: eventId, error } = await supabase.rpc('create_event', {
    p_team_id:     teamId,
    p_title:       title,
    p_starts_at:   startsAt,
    p_event_type:  'training',
    p_location:    location ?? null,
    p_description: description ?? null,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('keine berechtigung')) return { error: 'Du hast keine Berechtigung für diese Aktion.' }
    if (msg.includes('team nicht gefunden')) return { error: 'Team nicht gefunden.' }
    if (msg.includes('titel darf nicht leer')) return { error: 'Titel darf nicht leer sein.' }
    return { error: 'Training konnte nicht erstellt werden. Bitte erneut versuchen.' }
  }

  revalidatePath(`/teams/${teamId}`)
  redirect(eventId ? `/teams/${teamId}/events/${eventId}` : `/teams/${teamId}`)
}

export type RespondToEventState = { error: string } | null

const VALID_RSVP = ['attending', 'declined', 'maybe'] as const

export async function respondToEventAction(
  _prevState: RespondToEventState,
  formData: FormData,
): Promise<RespondToEventState> {
  const teamId   = (formData.get('team_id')     as string | null)?.trim()
  const eventId  = (formData.get('event_id')    as string | null)?.trim()
  const playerId = (formData.get('player_id')   as string | null)?.trim()
  const status   = (formData.get('rsvp_status') as string | null)?.trim()
  const note     = (formData.get('rsvp_note')   as string | null)?.trim() || null

  if (!teamId)   return { error: 'Team-ID fehlt.' }
  if (!eventId)  return { error: 'Event-ID fehlt.' }
  if (!playerId) return { error: 'Spieler-ID fehlt.' }
  if (!status || !VALID_RSVP.includes(status as (typeof VALID_RSVP)[number])) {
    return { error: 'Ungültige Antwort.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('respond_to_event', {
    p_event_id:    eventId,
    p_player_id:   playerId,
    p_rsvp_status: status,
    p_rsvp_note:   note,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('abgesagt'))           return { error: 'Dieses Training wurde abgesagt.' }
    if (msg.includes('keine berechtigung')) return { error: 'Du hast keine Berechtigung für diese Aktion.' }
    if (msg.includes('nicht gefunden'))     return { error: 'Kein Eintrag für diesen Spieler gefunden.' }
    return { error: 'Antwort konnte nicht gespeichert werden. Bitte erneut versuchen.' }
  }

  revalidatePath(`/teams/${teamId}/events/${eventId}`)
  revalidatePath(`/teams/${teamId}/events`)
  revalidatePath(`/teams/${teamId}`)
  redirect(`/teams/${teamId}/events/${eventId}`)
}

export type CancelEventState = { error: string } | { success: true } | null

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type RespondToEventAsStaffState = { error: string } | null

export async function respondToEventAsStaffAction(
  _prevState: RespondToEventAsStaffState,
  formData: FormData,
): Promise<RespondToEventAsStaffState> {
  const eventId = (formData.get('event_id')    as string | null)?.trim()
  const status  = (formData.get('rsvp_status') as string | null)?.trim()
  const note    = (formData.get('rsvp_note')   as string | null)?.trim() || null

  if (!eventId || !UUID_RE.test(eventId)) return { error: 'Termin nicht gefunden.' }
  if (!status || !VALID_RSVP.includes(status as (typeof VALID_RSVP)[number])) {
    return { error: 'Ungültige Antwort.' }
  }

  const supabase = await createClient()
  const { data: teamId, error } = await supabase.rpc('respond_to_event_as_staff', {
    p_event_id:    eventId,
    p_rsvp_status: status,
    p_rsvp_note:   note,
  })

  if (error || !teamId) {
    const msg = (error?.message ?? '').toLowerCase()
    if (msg.includes('nicht eingeloggt')) return { error: 'Bitte melde dich erneut an.' }
    if (msg.includes('abgesagt'))         return { error: 'Dieses Training wurde abgesagt.' }
    if (msg.includes('begonnen'))         return { error: 'Dieses Training hat bereits begonnen.' }
    if (msg.includes('nicht gefunden'))   return { error: 'Du hast keine Berechtigung für diese Aktion.' }
    return { error: 'Antwort konnte nicht gespeichert werden. Bitte erneut versuchen.' }
  }

  revalidatePath(`/teams/${teamId}/events/${eventId}`)
  revalidatePath(`/teams/${teamId}/events`)
  revalidatePath(`/teams/${teamId}`)
  redirect(`/teams/${teamId}/events/${eventId}`)
}

export async function cancelEventAction(
  _prevState: CancelEventState,
  formData: FormData,
): Promise<CancelEventState> {
  const eventId = (formData.get('event_id') as string | null)?.trim()

  if (!eventId || !UUID_RE.test(eventId)) return { error: 'Termin nicht gefunden.' }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Bitte melde dich erneut an.' }

  const { data: event } = await supabase
    .from('events')
    .select('team_id, event_type')
    .eq('id', eventId)
    .single()

  if (!event || event.event_type !== 'training') {
    return { error: 'Termin nicht gefunden.' }
  }

  const teamId = event.team_id

  const { error: cancelError } = await supabase.rpc('cancel_event', {
    p_event_id: eventId,
  })

  if (cancelError) {
    const msg = cancelError.message.toLowerCase()
    if (msg.includes('nicht eingeloggt'))   return { error: 'Bitte melde dich erneut an.' }
    if (msg.includes('nicht gefunden'))     return { error: 'Termin nicht gefunden.' }
    if (msg.includes('keine berechtigung')) return { error: 'Du hast keine Berechtigung für diese Aktion.' }
    return { error: 'Training konnte nicht abgesagt werden. Bitte erneut versuchen.' }
  }

  revalidatePath(`/teams/${teamId}/events/${eventId}`)
  revalidatePath(`/teams/${teamId}/events`)
  revalidatePath(`/teams/${teamId}`)
  revalidatePath(`/dashboard`)
  return { success: true }
}

export type UpdateTrainingState = { error: string } | null

export async function updateTrainingAction(
  _prevState: UpdateTrainingState,
  formData: FormData,
): Promise<UpdateTrainingState> {
  const eventId      = (formData.get('event_id')       as string | null)?.trim()
  const title        = (formData.get('title')          as string | null)?.trim()
  const startsAtDate = (formData.get('starts_at_date') as string | null)?.trim()
  const startsAtTime = (formData.get('starts_at_time') as string | null)?.trim()
  const location     = (formData.get('location')       as string | null)?.trim() || undefined
  const description  = (formData.get('description')    as string | null)?.trim() || undefined

  if (!eventId || !UUID_RE.test(eventId)) return { error: 'Termin nicht gefunden.' }
  if (!title)        return { error: 'Titel ist erforderlich.' }
  if (!startsAtDate) return { error: 'Datum ist erforderlich.' }
  if (!startsAtTime) return { error: 'Uhrzeit ist erforderlich.' }

  let startsAt: string
  try {
    startsAt = viennaLocalToUTC(startsAtDate, startsAtTime)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Ungültiges Datum oder Uhrzeit.' }
  }

  const supabase = await createClient()
  // team_id wird ausschließlich aus dem RPC-Rückgabewert übernommen, nie aus
  // Client-Eingaben — verhindert eine manipulierte Redirect-/Revalidation-Ziel-ID.
  const { data: teamId, error } = await supabase.rpc('update_training', {
    p_event_id:    eventId,
    p_title:       title,
    p_starts_at:   startsAt,
    p_location:    location ?? null,
    p_description: description ?? null,
  })

  if (error || !teamId) {
    const msg = (error?.message ?? '').toLowerCase()
    if (msg.includes('nicht eingeloggt'))              return { error: 'Bitte melde dich erneut an.' }
    if (msg.includes('nicht gefunden'))                return { error: 'Termin nicht gefunden.' }
    if (msg.includes('abgesagt'))                      return { error: 'Dieses Training wurde abgesagt und kann nicht mehr bearbeitet werden.' }
    if (msg.includes('bereits begonnen'))              return { error: 'Dieses Training hat bereits begonnen und kann nicht mehr bearbeitet werden.' }
    if (msg.includes('startzeit muss in der zukunft')) return { error: 'Die Startzeit muss in der Zukunft liegen.' }
    if (msg.includes('titel darf nicht leer'))         return { error: 'Titel darf nicht leer sein.' }
    return { error: 'Training konnte nicht gespeichert werden. Bitte erneut versuchen.' }
  }

  revalidatePath(`/teams/${teamId}/events/${eventId}`)
  revalidatePath(`/teams/${teamId}/events`)
  revalidatePath(`/teams/${teamId}`)
  revalidatePath(`/dashboard`)
  redirect(`/teams/${teamId}/events/${eventId}`)
}

export type DeleteTrainingState = { error: string } | null

export async function deleteTrainingAction(
  _prevState: DeleteTrainingState,
  formData: FormData,
): Promise<DeleteTrainingState> {
  const eventId = (formData.get('event_id') as string | null)?.trim()
  const confirmation = formData.get('confirmation') as string | null

  if (!eventId || !UUID_RE.test(eventId)) return { error: 'Termin nicht gefunden.' }
  if (confirmation !== 'LÖSCHEN') {
    return { error: 'Gib zum Löschen exakt LÖSCHEN ein.' }
  }

  const supabase = await createClient()
  // team_id kommt ausschließlich aus der erfolgreich autorisierten RPC.
  const { data: teamId, error } = await supabase.rpc('delete_training', {
    p_event_id: eventId,
    p_confirmation: confirmation,
  })

  if (error || !teamId) {
    const msg = (error?.message ?? '').toLowerCase()
    if (msg.includes('nicht eingeloggt')) return { error: 'Bitte melde dich erneut an.' }
    if (msg.includes('nicht gefunden')) return { error: 'Termin nicht gefunden.' }
    if (msg.includes('bestätigungstext')) return { error: 'Gib zum Löschen exakt LÖSCHEN ein.' }
    if (msg.includes('abgesagt')) return { error: 'Abgesagte Trainings bleiben als Historie erhalten.' }
    if (msg.includes('bereits begonnen')) return { error: 'Begonnene Trainings können nicht gelöscht werden.' }
    if (msg.includes('rückmeldungen')) return { error: 'Dieses Training hat bereits Rückmeldungen und kann nur abgesagt werden.' }
    return { error: 'Training konnte nicht gelöscht werden. Bitte erneut versuchen.' }
  }

  revalidatePath(`/teams/${teamId}/events`)
  revalidatePath(`/teams/${teamId}`)
  revalidatePath('/dashboard')
  redirect(`/teams/${teamId}/events`)
}
