'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type SignInState = { error: string } | null

export type FormValues = {
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  onboarding_role: string
}

export type SignUpState =
  | { error: string; values: FormValues; _key: number }
  | { success: true }
  | null

function safeRedirectPath(path: string | null): string {
  if (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('/login') &&
    !path.startsWith('/register') &&
    !path.startsWith('/auth')
  ) {
    return path
  }
  return '/dashboard'
}

export async function signInAction(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectPath = formData.get('redirect') as string | null

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'E-Mail oder Passwort ist ungültig.' }
  }

  redirect(safeRedirectPath(redirectPath))
}

const VALID_ONBOARDING_ROLES = ['player', 'guardian', 'coach', 'club_official', 'other'] as const

export async function signUpAction(
  _prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const email          = (formData.get('email') as string | null)?.trim() ?? ''
  const password       = (formData.get('password') as string | null) ?? ''
  const firstName      = (formData.get('first_name') as string | null)?.trim() ?? ''
  const lastName       = (formData.get('last_name') as string | null)?.trim() ?? ''
  const phone          = (formData.get('phone') as string | null)?.trim() ?? ''
  const dateOfBirth    = (formData.get('date_of_birth') as string | null)?.trim() ?? ''
  const onboardingRole = (formData.get('onboarding_role') as string | null)?.trim() ?? ''
  const redirectPath   = formData.get('redirect') as string | null
  const termsAccepted   = formData.get('terms_accepted') === 'on'
  const privacyAccepted = formData.get('privacy_accepted') === 'on'

  const values: FormValues = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    date_of_birth: dateOfBirth,
    onboarding_role: onboardingRole,
  }

  const err = (message: string): SignUpState =>
    ({ error: message, values, _key: Math.random() })

  if (!firstName) return err('Vorname ist erforderlich.')
  if (!lastName)  return err('Nachname ist erforderlich.')
  if (!email)     return err('E-Mail ist erforderlich.')

  // E-Mail: text@domain.tld — mindestens 2 Zeichen nach dem letzten Punkt
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return err('Bitte gib eine gültige E-Mail-Adresse ein (z. B. max@beispiel.at).')
  }

  if (!dateOfBirth) return err('Geburtsdatum ist erforderlich.')
  const dob = new Date(dateOfBirth)
  if (isNaN(dob.getTime())) return err('Bitte gib ein gültiges Geburtsdatum ein.')
  if (dob >= new Date()) return err('Geburtsdatum muss in der Vergangenheit liegen.')

  if (phone) {
    // Schritt 1: nur erlaubte Zeichen (Ziffern, +, Leerzeichen, -, /, (, ), .)
    if (!/^[+\d\s\-\(\)\/\.]+$/.test(phone)) {
      return err('Bitte gib eine gültige Telefonnummer ein (z. B. +43 664 1234567).')
    }
    // Schritt 2: Formatzeichen entfernen, 7–15 Ziffern mit optionalem führendem +
    const phoneDigits = phone.replace(/[\s\-\(\)\/\.]/g, '')
    if (!/^\+?\d{7,15}$/.test(phoneDigits)) {
      return err('Bitte gib eine gültige Telefonnummer ein (z. B. +43 664 1234567).')
    }
  }

  if (!onboardingRole || !VALID_ONBOARDING_ROLES.includes(onboardingRole as typeof VALID_ONBOARDING_ROLES[number])) {
    return err('Bitte wähle aus, wie du Vereon nutzen möchtest.')
  }

  if (!termsAccepted)   return err('Du musst die Nutzungsbedingungen akzeptieren.')
  if (!privacyAccepted) return err('Du musst die Datenschutzerklärung akzeptieren.')

  // Passwort: mind. 8 Zeichen, Groß-/Kleinbuchstaben, Zahl, Sonderzeichen
  const passwordValid =
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)

  if (!passwordValid) {
    return err(
      'Das Passwort muss mindestens 8 Zeichen lang sein und Großbuchstaben, Kleinbuchstaben, Zahlen und Sonderzeichen enthalten.',
    )
  }

  const now = new Date().toISOString()

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name:          firstName,
        last_name:           lastName,
        full_name:           `${firstName} ${lastName}`,
        phone,
        date_of_birth:       dateOfBirth,
        onboarding_role:     onboardingRole,
        terms_accepted_at:   now,
        privacy_accepted_at: now,
      },
    },
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('already exists')) {
      return err('Diese E-Mail-Adresse ist bereits registriert.')
    }
    return err('Registrierung fehlgeschlagen. Bitte versuche es erneut.')
  }

  if (data.session) {
    // Lokale Supabase-Instanz: enable_confirmations = false → sofortiger Login
    redirect(safeRedirectPath(redirectPath))
  }

  // Produktion: E-Mail-Bestätigung erforderlich — nach Klick auf Link weiter zu /dashboard
  return { success: true }
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
