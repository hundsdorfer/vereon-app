'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type RemovePlayerActionState = { error: string } | { success: true } | null

export async function removePlayerFromTeamAction(
  _prevState: RemovePlayerActionState,
  formData: FormData,
): Promise<RemovePlayerActionState> {
  const assignmentId = (formData.get('assignmentId') as string | null)?.trim()
  const teamId = (formData.get('teamId') as string | null)?.trim()

  if (!assignmentId || !teamId) return { error: 'Ungültige Anfrage.' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('remove_player_from_team', {
    p_assignment_id: assignmentId,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('nicht gefunden')) return { error: 'Zuordnung nicht gefunden.' }
    if (msg.includes('keine berechtigung')) return { error: 'Du hast keine Berechtigung für diese Aktion.' }
    if (msg.includes('bereits nicht mehr im team')) return { error: 'Dieser Spieler wurde bereits entfernt.' }
    return { error: 'Spieler konnte nicht entfernt werden. Bitte versuche es erneut.' }
  }

  revalidatePath(`/teams/${teamId}`)
  return { success: true }
}
