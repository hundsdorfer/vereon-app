'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type CreateEventState = { error: string } | null

function viennaLocalToISO(localStr: string): string {
  const tmp = new Date(localStr + ':00Z')
  const viennaStr = tmp
    .toLocaleString('sv', { timeZone: 'Europe/Vienna' })
    .replace(' ', 'T')
  const offsetMs = new Date(viennaStr + 'Z').getTime() - tmp.getTime()
  return new Date(tmp.getTime() - offsetMs).toISOString()
}

export async function createEventAction(
  _prevState: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const teamId      = (formData.get('team_id')     as string | null)?.trim()
  const title       = (formData.get('title')        as string | null)?.trim()
  const startsAtRaw = (formData.get('starts_at')    as string | null)?.trim()
  const location    = (formData.get('location')     as string | null)?.trim() || undefined
  const description = (formData.get('description')  as string | null)?.trim() || undefined

  if (!teamId)                          return { error: 'Team-ID fehlt.' }
  if (!title)                           return { error: 'Titel ist erforderlich.' }
  if (!startsAtRaw)                     return { error: 'Datum und Uhrzeit sind erforderlich.' }

  let startsAt: string
  try {
    startsAt = viennaLocalToISO(startsAtRaw)
  } catch {
    return { error: 'Ungültiges Datum oder Uhrzeit.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('create_event', {
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
  redirect(`/teams/${teamId}`)
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
