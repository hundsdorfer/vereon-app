'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

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
