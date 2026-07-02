'use server'

import { createClient } from '@/lib/supabase/server'

export type JoinState = { error: string } | { success: true } | null

export async function submitJoinRequestSelfAction(
  _prevState: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const code = (formData.get('code') as string | null)?.trim()
  if (!code) return { error: 'Ungültiger Einladungscode.' }

  const supabase = await createClient()

  const { error } = await supabase.rpc('submit_join_request_self', {
    p_code: code,
  })

  if (error) {
    const msg = error.message
    if (msg.includes('Profil unvollständig')) {
      return { error: 'Dein Profil ist unvollständig. Bitte ergänze deinen Namen in den Profileinstellungen.' }
    }
    if (msg.includes('bereits eine offene Beitrittsanfrage')) {
      return { error: 'Du hast bereits eine offene Beitrittsanfrage für dieses Team.' }
    }
    if (msg.includes('bereits Mitglied')) {
      return { error: 'Du bist bereits Mitglied dieses Teams.' }
    }
    if (msg.includes('widerrufen') || msg.includes('abgelaufen') || msg.includes('nicht gefunden') || msg.includes('maximale Nutzungen')) {
      return { error: 'Dieser Einladungslink ist nicht mehr gültig. Bitte wende dich an den Trainer.' }
    }
    if (msg.includes('Nicht eingeloggt')) {
      return { error: 'Du musst angemeldet sein, um eine Beitrittsanfrage zu stellen.' }
    }
    return { error: 'Die Anfrage konnte nicht gesendet werden. Bitte versuche es erneut.' }
  }

  return { success: true }
}

export async function submitJoinRequestGuardianAction(
  _prevState: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const code      = (formData.get('code')       as string | null)?.trim()
  const firstName = (formData.get('first_name') as string | null)?.trim()
  const lastName  = (formData.get('last_name')  as string | null)?.trim()
  const birthYearRaw = (formData.get('child_birth_year') as string | null)?.trim()
  const birthYear = birthYearRaw ? Number(birthYearRaw) : NaN

  if (!code)      return { error: 'Ungültiger Einladungscode.' }
  if (!firstName) return { error: 'Vorname des Kindes ist erforderlich.' }
  if (!lastName)  return { error: 'Nachname des Kindes ist erforderlich.' }
  if (!birthYearRaw || !Number.isInteger(birthYear)) {
    return { error: 'Geburtsjahr des Kindes ist erforderlich.' }
  }
  if (birthYear < 1900 || birthYear > new Date().getFullYear()) {
    return { error: 'Bitte ein gültiges Geburtsjahr angeben.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('submit_join_request_guardian', {
    p_code:               code,
    p_first_name:         firstName,
    p_last_name:          lastName,
    p_child_birth_year:   birthYear,
  })

  if (error) {
    const msg = error.message
    if (msg.includes('bereits eine offene Beitrittsanfrage')) {
      return { error: 'Du hast bereits eine offene Beitrittsanfrage für dieses Team gesendet.' }
    }
    if (msg.includes('Ungültiges Geburtsjahr')) {
      return { error: 'Bitte ein gültiges Geburtsjahr angeben.' }
    }
    if (msg.includes('widerrufen') || msg.includes('abgelaufen') || msg.includes('nicht gefunden') || msg.includes('maximale Nutzungen')) {
      return { error: 'Dieser Einladungslink ist nicht mehr gültig. Bitte wende dich an den Trainer.' }
    }
    if (msg.includes('Nicht eingeloggt')) {
      return { error: 'Du musst angemeldet sein, um eine Beitrittsanfrage zu stellen.' }
    }
    return { error: 'Die Anfrage konnte nicht gesendet werden. Bitte versuche es erneut.' }
  }

  return { success: true }
}
