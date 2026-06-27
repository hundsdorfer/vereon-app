'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type JoinRequestActionState = { error: string } | { success: true } | null

export async function approveJoinRequestAction(
  _prevState: JoinRequestActionState,
  formData: FormData,
): Promise<JoinRequestActionState> {
  const requestId = (formData.get('requestId') as string | null)?.trim()
  const teamId    = (formData.get('teamId')    as string | null)?.trim()

  if (!requestId || !teamId) return { error: 'Ungültige Anfrage.' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('approve_join_request', { p_request_id: requestId })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('nicht gefunden'))   return { error: 'Anfrage nicht gefunden.' }
    if (msg.includes('nicht mehr offen')) return { error: 'Diese Anfrage wurde bereits bearbeitet.' }
    if (msg.includes('keine berechtigung')) return { error: 'Du hast keine Berechtigung für diese Aktion.' }
    return { error: 'Fehler beim Annehmen. Bitte erneut versuchen.' }
  }

  revalidatePath(`/teams/${teamId}/requests`)
  revalidatePath(`/teams/${teamId}`)
  return { success: true }
}

export async function rejectJoinRequestAction(
  _prevState: JoinRequestActionState,
  formData: FormData,
): Promise<JoinRequestActionState> {
  const requestId = (formData.get('requestId') as string | null)?.trim()
  const teamId    = (formData.get('teamId')    as string | null)?.trim()

  if (!requestId || !teamId) return { error: 'Ungültige Anfrage.' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('reject_join_request', { p_request_id: requestId })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('nicht gefunden'))   return { error: 'Anfrage nicht gefunden.' }
    if (msg.includes('nicht mehr offen')) return { error: 'Diese Anfrage wurde bereits bearbeitet.' }
    if (msg.includes('keine berechtigung')) return { error: 'Du hast keine Berechtigung für diese Aktion.' }
    return { error: 'Fehler beim Ablehnen. Bitte erneut versuchen.' }
  }

  revalidatePath(`/teams/${teamId}/requests`)
  revalidatePath(`/teams/${teamId}`)
  return { success: true }
}
