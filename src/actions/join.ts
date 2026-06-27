'use server'

import { createClient } from '@/lib/supabase/server'

export type JoinState = { error: string } | { success: true } | null

export async function submitJoinRequestSelfAction(
  _prevState: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const code = (formData.get('code') as string | null)?.trim()
  const firstName = (formData.get('first_name') as string | null)?.trim()
  const lastName = (formData.get('last_name') as string | null)?.trim()
  const birthYearRaw = formData.get('birth_year') as string | null
  const position = (formData.get('position') as string | null)?.trim() || undefined
  const jerseyNrRaw = formData.get('jersey_nr') as string | null

  if (!code) return { error: 'Ungültiger Einladungscode.' }
  if (!firstName) return { error: 'Vorname ist erforderlich.' }
  if (!lastName) return { error: 'Nachname ist erforderlich.' }

  const birthYear = birthYearRaw?.trim() ? parseInt(birthYearRaw, 10) : undefined
  if (birthYear !== undefined && (isNaN(birthYear) || birthYear < 1900 || birthYear > 2100)) {
    return { error: 'Ungültiges Geburtsjahr (1900–2100).' }
  }

  const jerseyNr = jerseyNrRaw?.trim() ? parseInt(jerseyNrRaw, 10) : undefined
  if (jerseyNr !== undefined && (isNaN(jerseyNr) || jerseyNr < 1 || jerseyNr > 99)) {
    return { error: 'Trikotnummer muss zwischen 1 und 99 liegen.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('submit_join_request_self', {
    p_code: code,
    p_first_name: firstName,
    p_last_name: lastName,
    ...(birthYear !== undefined && { p_birth_year: birthYear }),
    ...(position !== undefined && { p_position: position }),
    ...(jerseyNr !== undefined && { p_jersey_nr: jerseyNr }),
  })

  if (error) {
    const msg = error.message
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
  const code = (formData.get('code') as string | null)?.trim()
  const firstName = (formData.get('first_name') as string | null)?.trim()
  const lastName = (formData.get('last_name') as string | null)?.trim()
  const birthYearRaw = formData.get('birth_year') as string | null
  const position = (formData.get('position') as string | null)?.trim() || undefined
  const jerseyNrRaw = formData.get('jersey_nr') as string | null

  if (!code) return { error: 'Ungültiger Einladungscode.' }
  if (!firstName) return { error: 'Vorname des Kindes ist erforderlich.' }
  if (!lastName) return { error: 'Nachname des Kindes ist erforderlich.' }

  const birthYear = birthYearRaw?.trim() ? parseInt(birthYearRaw, 10) : undefined
  if (birthYear !== undefined && (isNaN(birthYear) || birthYear < 1900 || birthYear > 2100)) {
    return { error: 'Ungültiges Geburtsjahr (1900–2100).' }
  }

  const jerseyNr = jerseyNrRaw?.trim() ? parseInt(jerseyNrRaw, 10) : undefined
  if (jerseyNr !== undefined && (isNaN(jerseyNr) || jerseyNr < 1 || jerseyNr > 99)) {
    return { error: 'Trikotnummer muss zwischen 1 und 99 liegen.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('submit_join_request_guardian', {
    p_code: code,
    p_first_name: firstName,
    p_last_name: lastName,
    ...(birthYear !== undefined && { p_birth_year: birthYear }),
    ...(position !== undefined && { p_position: position }),
    ...(jerseyNr !== undefined && { p_jersey_nr: jerseyNr }),
  })

  if (error) {
    const msg = error.message
    if (msg.includes('bereits eine offene Beitrittsanfrage')) {
      return { error: 'Du hast bereits eine offene Beitrittsanfrage für dieses Team gesendet.' }
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
