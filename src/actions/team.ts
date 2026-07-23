'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type CreateTeamState = { error: string } | null

export async function createTeamAction(
  _prevState: CreateTeamState,
  formData: FormData,
): Promise<CreateTeamState> {
  const teamName = (formData.get('team_name') as string | null)?.trim()
  const ageGroup = (formData.get('age_group') as string | null)?.trim() || undefined
  const gender = (formData.get('gender') as string | null) || undefined

  if (!teamName) {
    return { error: 'Teamname ist erforderlich.' }
  }

  const supabase = await createClient()
  const { data: teamId, error } = await supabase.rpc('create_independent_team', {
    p_team_name: teamName,
    p_age_group: ageGroup,
    p_gender: gender,
    p_also_head_coach: true,
  })

  if (error) {
    return { error: 'Team konnte nicht erstellt werden. Bitte versuche es erneut.' }
  }

  revalidatePath('/teams')
  revalidatePath('/dashboard')
  redirect(teamId ? `/teams/${teamId}` : '/teams')
}

export type GrantAssistantCoachState = { error: string } | { success: true } | null

export async function grantAssistantCoachAction(
  _prevState: GrantAssistantCoachState,
  formData: FormData,
): Promise<GrantAssistantCoachState> {
  const teamId       = (formData.get('team_id')        as string | null)?.trim()
  const targetUserId = (formData.get('target_user_id') as string | null)?.trim()

  if (!teamId || !UUID_RE.test(teamId)) return { error: 'Team nicht gefunden.' }
  if (!targetUserId || !UUID_RE.test(targetUserId)) return { error: 'Person nicht gefunden.' }

  const supabase = await createClient()
  const { data: returnedTeamId, error } = await supabase.rpc('grant_assistant_coach', {
    p_team_id: teamId,
    p_target_user_id: targetUserId,
  })

  if (error || !returnedTeamId) {
    const msg = (error?.message ?? '').toLowerCase()
    if (msg.includes('nicht eingeloggt'))     return { error: 'Bitte melde dich erneut an.' }
    if (msg.includes('keine berechtigung'))   return { error: 'Du hast keine Berechtigung für diese Aktion.' }
    if (msg.includes('eigene rolle'))         return { error: 'Du kannst dir nicht selbst diese Rolle geben.' }
    if (msg.includes('kein aktiver spieler')) return { error: 'Diese Person ist kein aktiver Spieler in diesem Team.' }
    return { error: 'Rolle konnte nicht vergeben werden. Bitte erneut versuchen.' }
  }

  revalidatePath(`/teams/${returnedTeamId}`)
  return { success: true }
}

export type RevokeAssistantCoachState = { error: string } | { success: true } | null

export async function revokeAssistantCoachAction(
  _prevState: RevokeAssistantCoachState,
  formData: FormData,
): Promise<RevokeAssistantCoachState> {
  const teamId       = (formData.get('team_id')        as string | null)?.trim()
  const targetUserId = (formData.get('target_user_id') as string | null)?.trim()

  if (!teamId || !UUID_RE.test(teamId)) return { error: 'Team nicht gefunden.' }
  if (!targetUserId || !UUID_RE.test(targetUserId)) return { error: 'Person nicht gefunden.' }

  const supabase = await createClient()
  const { data: returnedTeamId, error } = await supabase.rpc('revoke_assistant_coach', {
    p_team_id: teamId,
    p_target_user_id: targetUserId,
  })

  if (error || !returnedTeamId) {
    const msg = (error?.message ?? '').toLowerCase()
    if (msg.includes('nicht eingeloggt'))   return { error: 'Bitte melde dich erneut an.' }
    if (msg.includes('keine berechtigung')) return { error: 'Du hast keine Berechtigung für diese Aktion.' }
    if (msg.includes('eigene rolle'))       return { error: 'Du kannst dir nicht selbst diese Rolle entziehen.' }
    if (msg.includes('kein co-trainer'))    return { error: 'Diese Person ist kein Co-Trainer.' }
    return { error: 'Rolle konnte nicht entzogen werden. Bitte erneut versuchen.' }
  }

  revalidatePath(`/teams/${returnedTeamId}`)
  return { success: true }
}
